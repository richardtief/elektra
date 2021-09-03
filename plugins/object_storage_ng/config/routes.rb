ObjectStorageNg::Engine.routes.draw do
  root to: 'application#show', as: :widget

  resources :containers, only: %i[index create destroy ] do
    member do
      put 'empty' => 'containers#empty'
      get 'metadata' => 'containers#metadata'
      put 'metadata' => 'containers#update_metadata'
      get 'check-acls' => 'containers#check_acls'
      put 'access-control' => 'containers#update_access_control'
    end

    resources :objects, only: %i[index] do 
      collection do
        get 'download' => 'objects#download'
        delete '' => 'objects#destroy'
      end
    end
  end
  resources :capabilities, only: %i[index]


end
