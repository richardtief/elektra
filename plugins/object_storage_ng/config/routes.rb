ObjectStorageNg::Engine.routes.draw do
  root to: 'application#show', as: :widget

  resources :containers, only: %i[index create destroy ] do
    member do
      put 'empty' => 'containers#empty'
      get 'metadata' => 'containers#metadata'
      put 'metadata' => 'containers#update_metadata'
    end
  end
  resources :capabilities, only: %i[index]
end
