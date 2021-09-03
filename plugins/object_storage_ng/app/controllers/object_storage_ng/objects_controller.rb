module ObjectStorageNg
  class ObjectsController < ::AjaxController

    authorization_required

    def index
      # byebug
      container_name = params.require(:container_id)
      code, objects = services.object_storage_ng.list_objects(container_name)
      if code.to_i >= 400
        render json: {errors: objects.messages}, status: code
      else
        render json: objects
      end
    end

    def destroy
      container_name = params.require(:container_id)
      object_path = params.require(:path)

      # instead of @object.destroy we need to call the delete function directly
      # because we need to give more than one parameter
      keep_segments = params[:keep_segments] == "true"

      code, error = services.object_storage_ng.delete_object(container_name,object_path,keep_segments)
      if code.to_i >= 400
        render json: {errors: error.messages}, status: code
      else
        head :ok
      end
    end

    def download
      container_name = params.require(:container_id)
      object_path = params.require(:path)

      code, responseHeaders, content = services.object_storage_ng.get_object_content(container_name, object_path)

      if code.to_i >= 400
        render json: {errors: content.messages}, status: code
      else
        headers['Content-Type'] = responseHeaders['content-type']
        if params[:inline] == '1'
          headers['Content-Disposition'] = "inline"
          render inline: content
          #render html: @object.file_contents
        else
          basename = /[^\/]*\/?$/.match(object_path)[0]
          headers['Content-Disposition'] = "attachment; filename=\"#{basename}\""
          render body: content
        end
      end
    end

  end
end
