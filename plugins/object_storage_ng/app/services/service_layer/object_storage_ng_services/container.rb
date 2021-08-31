module ServiceLayer
  module ObjectStorageNgServices
    # implements Openstack Swift Container API
    module Container
      # # # CONTAINER #

      METADATA_HEADER_PREFIX = /^(x-container|x-versions).*/

      def list_containers
        return 200, elektron_object_storage.get('/').body
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      def get_container_metadata(name)
        response = elektron_object_storage.head(name)
        metadata = {}

        response.header.each_header do |key, value| 
          next unless METADATA_HEADER_PREFIX.match? key
          metadata[key] = value 
        end
        metadata['public_url'] = public_url(name)

        return 200, metadata
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      def update_container_metadata(name,metadata={})
        elektron_object_storage.post(name, headers: metadata)
        return 204
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      def create_container(params)
        elektron_object_storage.put(params[:name]){}
        return 201
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      # returns http code and errors
      def delete_container(name)
        response = elektron_object_storage.delete(name)
        return response.header.code
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      def empty_container(name)
        objects = list_objects(name)
        bulk_delete(objects)
        return 204
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      def empty_container(name)
        code, objects = list_objects(name)
        return code if code.to_i >= 400
        code, capabilities = list_capabilities
        return code if code.to_i >= 400
        bulk_delete_options = capabilities.nil? ? nil : capabilities.fetch("bulk_delete",nil)
        bulk_delete_objects(name, objects, bulk_delete_options)
        return 204
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')  
      end

      protected

      def public_url(container_name, object_path = nil)
        return nil if container_name.nil?
        url = "#{elektron_object_storage.endpoint_url}/#{escape(container_name)}"
        if object_path.nil?
          # path to container listing needs a trailing slash to work in a browser
          url << '/'
        else
          url << "/#{escape(object_path)}"
        end
        url
      end

      # https://github.com/fog/fog-openstack/blob/bd69c6f3a80bb4a984d6fc67971a496cc923ac98/lib/fog/openstack.rb#L588
      def escape(str, extra_exclude_chars = '')
        str.gsub(/([^a-zA-Z0-9_.\/#{extra_exclude_chars}-]+)/) do
          '%' + Regexp.last_match(1).unpack('H2' * Regexp.last_match(1).bytesize).join('%').upcase
        end
      end
      
    end
  end
end