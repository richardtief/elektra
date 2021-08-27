module ServiceLayer
  module ObjectStorageNgServices
    # implements Openstack Swift Container API
    module Capability
      def list_capabilities
        return 200, elektron_object_storage.get('info', path_prefix: '/').body
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end
    end
  end
end