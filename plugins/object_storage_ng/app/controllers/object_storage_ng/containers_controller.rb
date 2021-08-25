module ObjectStorageNg
  class ContainersController < ::AjaxController
    authorization_required

    def index
      render json: services.object_storage.containers
    end

  end
end
