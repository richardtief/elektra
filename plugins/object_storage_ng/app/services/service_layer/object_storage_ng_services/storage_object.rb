module ServiceLayer
  module ObjectStorageNgServices
    # implements Openstack Swift Container API
    module StorageObject
      # OBJECT #




      # [
      #   {
      #    "bytes"=>643201, 
      #    "hash"=>"121863a07a7585c8eedcf32a6a69237e", 
      #    "name"=>"//foo", 
      #    "content_type"=>"application/octet-stream", 
      #    "last_modified"=>"2021-08-24T11:11:34.390690"
      #   }, 
      #   {
      #     "bytes"=>0, 
      #     "hash"=>"d41d8cd98f00b204e9800998ecf8427e", 
      #     "name"=>"foo/", 
      #     "content_type"=>"application/directory", 
      #     "last_modified"=>"2021-08-26T10:45:17.965510"
      #   }
      # ]
      # NOTE: keep in mind there is a limit container_listing_limit
      def list_objects(container_name, options={})
        # prevent prefix and delimiter with slash, if this happens
        # an empty list is returned
        options[:prefix] = '' if options[:prefix] == '/' && options[:delimiter] == '/'

        return 200, elektron_object_storage.get(container_name, options).body
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      def delete_object(container_name,object_name) 
        response = elektron_object_storage.delete("#{container_name}/#{object_name}")
        return response.header.code
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      # <- body:  {"Response Status"=>"200 OK", "Response Body"=>"", "Number Deleted"=>3, "Number Not Found"=>0, "Errors"=>[]}
      def bulk_delete_objects(container_name,objects, bulk_delete_options = nil)
        # byebug
        if bulk_delete_options
          # https://docs.openstack.org/swift/latest/middleware.html#bulk-delete
          # assemble the request object_list containing the paths to all targets

          # if targets more than the defined max deletes per request cut targest into half and try recursively
          if objects.length > bulk_delete_options['max_deletes_per_request']
            left,right = objects.each_slice( (objects.size/2.0).round ).to_a
            bulk_delete_objects(container_name,left, bulk_delete_options)
            objects = right
          end
          
          object_list = objects.map do |o| 
            "#{container_name}/#{o['name']}"
          end.join("\n")

          elektron_object_storage.post(
            '',
            'bulk-delete' => true, headers: { 'Content-Type' => 'text/plain' }
          ) { object_list }
        else
          objects.each do |o|
            delete_object(container_name, o['name'])
          end
        end
      end
    end
  end
end