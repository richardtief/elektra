module ServiceLayer
  module ObjectStorageNgServices
    # implements Openstack Swift Container API
    module StorageObject
      # OBJECT #

      def get_object_content(container_name, object_path)
        response = elektron_object_storage.get(
          "#{container_name}/#{object_path}"
        )

        metadata = {}

        response.header.each_header do |key, value| 
          metadata[key] = value 
        end
        content = response.body.is_a?(String) ? response.body : response.body.to_string 

        return 200, metadata, content
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      def get_object_metadata(container_name,object_path)
        return nil if container_name.blank? || object_path.blank?
        response = elektron_object_storage.head(
          "#{container_name}/#{object_path}"
        )
        metadata = {}

        response.header.each_header do |key, value| 
          metadata[key] = value 
        end

        return 200, metadata
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')  
      end

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


      def delete_folder(container_name, object_path)
        targets = list_objects_below_path(
          container_name, sanitize_path(object_path) + '/'
        ).map do |obj|
          { container: container_name, object: obj.path }
        end
        bulk_delete(targets)
      end

      def delete_object(container_name,object_name) 
        response = elektron_object_storage.delete("#{container_name}/#{object_name}")
        return response.header.code
      rescue Elektron::Errors::ApiResponse => e
        return e.code, e.messages.join(', ')
      end

      def delete_object(container_name, object_path, keep_segments = true)
        code, headers = get_object_metadata(container_name, object_path)

        return code, headers if code.to_i >= 400

        byebug
        # if keep_segments
        #   elektron_object_storage.delete("#{container_name}/#{object_path}")
        # else
        #   if headers['x-static-large-object']
        #     elektron_object_storage.delete("#{container_name}/#{object.path}?multipart-manifest=delete")
        #   elsif headers['x-object-manifest']
        #     # delete dlo manifest
        #     elektron_object_storage.delete("#{container_name}/#{object.path}")
            
        #     # delete segments container
        #     segments_container = headers['x-object-manifest'].split('/')).first
        #     segments_folder_path = headers['x-object-manifest'].slice!(segments_container)
        #     delete_folder(segments_container,segments_folder_path)
        #   else
        #     elektron_object_storage.delete("#{container_name}/#{object.path}")
        #   end
        # end
        # return nil because nothing usable is returned from the API
        return code
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