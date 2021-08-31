module ObjectStorageNg
  class ContainersController < ::AjaxController
    authorization_required

    def index
      # byebug
      code, containers = services.object_storage_ng.list_containers
      if code.to_i >= 400
        render json: {errors: e.messages}, status: code
      else
        render json: containers
      end
    end

    def create
      code = services.object_storage_ng.create_container(params.require(:container))
      if code.to_i >= 400 
        render json: {errors: e.messages}, status: code
      else
        render json: {}
      end
    end

    def empty
      code = services.object_storage_ng.empty_container(params.require(:id))
      if code.to_i >= 400 
        render json: {errors: e.messages}, status: code
      else
        head :ok
      end
    end

    def metadata
      code, metadata = services.object_storage_ng.get_container_metadata(params.require(:id))
      if code.to_i >= 400
        render json: {errors: e.messages}, status: code
      else
        render json: metadata
      end
    end

    def update_metadata
      container_name = params.require(:id)
      attrs = params.require(:metadata).permit!
      metadata = attrs.select {|k,v| !v.blank?}
      metadata["x-versions-location"] = "" unless metadata["x-versions-location"]
      metadata["x-container-meta-web-listings"] = "1" if metadata["x-container-meta-web-listings"] 

      # byebug
      code = services.object_storage_ng.update_container_metadata(container_name,metadata)
      if code.to_i >= 400
        render json: {errors: e.messages}, status: code
      else
        render json: metadata
      end
    end

    def destroy
      code, errors = services.object_storage_ng.delete_container(params.require(:id))
      if code.to_i >= 400
        render json: {errors: errors}, status: code
      else 
        head :ok
      end
    end
  end
end
