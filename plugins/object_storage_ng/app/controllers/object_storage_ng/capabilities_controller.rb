module ObjectStorageNg
  class CapabilitiesController < ::AjaxController
    authorization_required

    def index
      render json: services.object_storage.list_capabilities
    end
  end
end
