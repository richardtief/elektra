module ObjectStorageNg
  class ObjectsController < ::AjaxController

    authorization_required

    def index
      # byebug
      container_name = params.require(:id)
      code, objects = services.object_storage_ng.list_objects(container_name)
      if code.to_i >= 400
        render json: {errors: e.messages}, status: code
      else
        render json: objects
      end
    end

  end
end
