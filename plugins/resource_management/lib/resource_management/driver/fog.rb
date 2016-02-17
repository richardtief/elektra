require 'fog/openstack/storage'

module ResourceManagement
  module Driver
    class Fog < Interface
      include Core::ServiceLayer::FogDriver::ClientHelper

      def initialize(params)        
        super(params)
        # get existing service user connection (we need this to enumerate all
        # existing domains and projects, and to authorize the service user's
        # access to new domains and projects where necessary)

        # set service_user_token given by params (see app/services/service_layer/resource_management_service.rb)
        @service_user_token = params[:service_user_token]
        
        # create service_user_connection
        @srv_conn = self.class.service_user_connection(@service_user_token,auth_params)
      end  
      
      def self.service_user_connection(service_user_token,auth_params)
        params = auth_params.select{|k,v| [:provider, :openstack_auth_url, :openstack_region, :connection_options].include?(k)}.merge(openstack_auth_token: service_user_token)
        @service_user_connection ||= ::Fog::Identity::OpenStack::V3.new(params)
      end    

      # List all domains that exist, as a hash of { id => name }.
      def enumerate_domains
        result = {}
        @srv_conn.list_domains.body['domains'].each do |domain|
          result[ domain['id'] ] = domain['name']
        end
        return result
      end

      # List all projects that exist in the given domain, as a hash of { id => name }.:
      def enumerate_projects(domain_id)
        result = {}
        @srv_conn.list_projects(domain_id: domain_id).body['projects'].each do |project|
          result[ project['id'] ] = project['name']
        end
        return result
      end

      # Query quotas for the given project from the given service.
      # Returns a hash with resource names as keys. The service argument and
      # the resource names in the result are symbols, with acceptable values
      # defined in ResourceManagement::{ResourceConfig,ServiceConfig}.
      def query_project_quota(domain_id, project_id, service)
        # dispatch into the private implementation methods for each service
        method = "query_project_quota_#{service}".to_sym
        if respond_to?(method, true)
          return send(method, domain_id, project_id)
        else
          return mock_implementation.query_project_quota(domain_id, project_id, service)
        end
      end

      # Query usage values for the given project from the given service.
      # Returns a hash with resource names as keys. The service argument and
      # the resource names in the result are symbols, with acceptable values
      # defined in ResourceManagement::{ResourceConfig,ServiceConfig}.
      def query_project_usage(domain_id, project_id, service)
        # dispatch into the private implementation methods for each service
        method = "query_project_usage_#{service}".to_sym
        if respond_to?(method, true)
          return send(method, domain_id, project_id)
        else
          return mock_implementation.query_project_usage(domain_id, project_id, service)
        end
      end

      # Set quotas for the given project in the given service. `values` must be
      # a hash with resource names as keys. The service argument and resource
      # names are symbols, with acceptable values defined in
      # ResourceManagement::{ResourceConfig,ServiceConfig}.
      def set_project_quota(domain_id, project_id, service, values)
        # dispatch into the private implementation methods for each service
        method = "set_project_quota_#{service}".to_sym
        if respond_to?(method, true)
          return send(method, domain_id, project_id, values)
        else
          # ignore a missing implementation in development mode (where mock data is used)
          raise ServiceLayer::Errors::NotImplemented unless Rails.env.development?
        end
      end

      private

      def mock_implementation
        @mocker ||= ResourceManagement::Driver::Mock.new
      end

      def query_project_quota_object_storage(domain_id, project_id)
        metadata = get_swift_account_metadata(domain_id, project_id)
        return { capacity: metadata.fetch('X-Account-Meta-Quota-Bytes', -1).to_i }
      end

      def query_project_usage_object_storage(domain_id, project_id)
        metadata = get_swift_account_metadata(domain_id, project_id)
        return { capacity: metadata['X-Account-Bytes-Used'].to_i }
      end

      def set_project_quota_object_storage(domain_id, project_id, values)
        return unless values.has_key?(:capacity)

        with_service_user_connection_for_swift(project_id) do |connection|
          # the post_account request is not yet implemented in Fog (TODO: add it),
          # so let's use request() directly
          connection.request(
            expects: [200, 204],
            method:  'POST',
            path:    '',
            query:   { format: 'json' },
            headers: { 'x-account-meta-quota-bytes' => values[:capacity] },
          )
          return
        end
      end

      # The query for quota and usage in Swift use the same request, so this
      # method caches it.
      def get_swift_account_metadata(domain_id, project_id)
        @swift_account_metadata_cache ||= {}
        @swift_account_metadata_cache[project_id] ||= with_service_user_connection_for_swift(project_id) do |connection|
          # the head_account request is not yet implemented in Fog (TODO: add it),
          # so let's use request() directly
          connection.request(
            :expects => [200, 204], # usually 204, but sometimes Swift Kilo inexplicably returns 200
            :method  => 'HEAD',
            :path    => '',
            :query   => { 'format' => 'json' },
          ).headers.to_hash
        end
      end

      # NOTE: Use like this:
      #
      # with_service_user_connection(::Fog::Compute::OpenStack, domain_id, project_id) do |connection|
      #    ...
      # end
      def with_service_user_connection(fog_class, domain_id, project_id, &block)
        # establish service user connection to selected domain/project (this is
        # a bit ugly since MonsoonOpenstackAuth does not want to give us the
        # password back, so we have to resort to ENV there)
        auth_params = {
          openstack_auth_url:          @auth_url,
          openstack_region:            @region,
          openstack_auth_token:        @service_user_token,   
          openstack_project_domain_id: domain_id,
          openstack_project_id:        project_id,
          connection_options:          { ssl_verify_peer: false },
        }

        return yield(fog_class.new(auth_params))
      rescue Excon::Errors::Unauthorized, Excon::Errors::Forbidden
        # dashboard user may not have access to this project yet -> grant
        # service user role in this project
        roles = @srv_conn.list_roles(name: 'service').body['roles']
        raise "missing role \"service\" in Keystone" if roles.empty?
        @srv_conn.grant_project_user_role(project_id, @srv_conn.current_user_id, roles.first['id'])

        # try again after granting the service role
        return yield(fog_class.new(auth_params))
      end

      # NOTE: Use like this:
      #
      # with_service_user_connection_for_swift(project_id) do |connection|
      #    ...
      # end
      def with_service_user_connection_for_swift(project_id, options={}, &block)
        # the "service" role usually means "readonly access to everything",
        # but not for Swift; here only the reseller-admin role works; but stuff
        # gets easier again since we only need the reseller-admin role on the
        # service project of the service user

        # establish service user token for service project (same basic
        # methodology as above, but since it's always the same token scope, we
        # can store and reuse the connection object)
        @service_project_id ||= @srv_conn.auth_projects.body['projects'].first['id']
        @swift_conn         ||= ::Fog::Storage::OpenStack.new(
          provider:                    'openstack', 
          openstack_auth_url:          @auth_url,
          openstack_region:            @region,
          openstack_auth_token:        @service_user_token,
          openstack_project_id:        @service_project_id,
          connection_options:          { ssl_verify_peer: false },
        )
        

        # extract original storage URL from connection object, and store it
        # since we're going to modify it now
        @swift_conn_path ||= @swift_conn.instance_variable_get(:@path)

        # adjust the storage URL to point to the desired project (this looks
        # insane, but the admin tasks in the swiftclient also allow to supply a
        # user-defined storage URL, see for example
        # <http://docs.openstack.org/liberty/config-reference/content/object-storage-account-quotas.html>)
        # (TODO: use that reasoning to get a storage_path reader/writer into
        # Fog::Storage::OpenStack)
        storage_path = @swift_conn_path.gsub(@service_project_id, project_id)
        @swift_conn.instance_variable_set(:@path, storage_path)

        if options[:retrying]
          yield(@swift_conn)
        else
          begin
            yield(@swift_conn)
          rescue Excon::Errors::Unauthorized, Excon::Errors::Forbidden
            # if service user does not have the ResellerAdmin role yet, grant
            # it, then retry the request
            role_name = ENV.fetch('SWIFT_RESELLERADMIN_ROLE', 'ResellerAdmin')
            roles = @srv_conn.list_roles(name: role_name).body['roles']
            raise "missing role \"#{role_name}\" in Keystone" if roles.empty?
            @srv_conn.grant_project_user_role(@service_project_id, @srv_conn.current_user_id, roles.first['id'])

            # clear all relevant instance variables since we need to recreate
            # the service user connection with the new set of roles
            @swift_conn = nil
            @swift_conn_path = nil

            # retry, but set options[:retrying] to make sure that we don't try
            # to grant the role again
            with_service_user_connection_for_swift(project_id, options.merge(retrying: true), &block)
          end
        end
      end


    end
  end
end
