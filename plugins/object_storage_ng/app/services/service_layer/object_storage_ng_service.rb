# frozen_string_literal: true

module ServiceLayer
  # This class implements the object_storage_ng api
  class ObjectStorageNgService < Core::ServiceLayer::Service
    def available?(_action_name_sym = nil)
      true
    end

    def test
      elektron.service('object_storage_ng').get('/')
    end
  end
end
