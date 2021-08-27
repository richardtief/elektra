# frozen_string_literal: true

module ServiceLayer
  # This class implements the object_storage_ng api
  class ObjectStorageNgService < Core::ServiceLayer::Service
    class ApiError < StandardError; end

    # include ObjectStorageServices::Account
    # include ObjectStorageServices::StorageObject
    include ObjectStorageNgServices::Container
    include ObjectStorageNgServices::Capability
    include ObjectStorageNgServices::StorageObject

    def available?(_action_name_sym = nil)
      elektron.service?('object-store')
    end

    def elektron_object_storage
      @elektron_object_storage ||= elektron.service('object-store')
    end
  end
end
