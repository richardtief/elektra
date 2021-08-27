module ObjectStorageNg
  class CapabilitiesController < ::AjaxController
    authorization_required

    def index
      code, capabilities = services.object_storage_ng.list_capabilities
      if code.to_i >= 400 
        render json: {errors: e.messages}, status: code
      else
        render json: capabilities
      end
    end
  end
end
