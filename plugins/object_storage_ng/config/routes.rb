ObjectStorageNg::Engine.routes.draw do
  root to: 'application#show', as: :widget

  resources :containers, only: %i[index]
  resources :capabilities, only: %i[index]
end
