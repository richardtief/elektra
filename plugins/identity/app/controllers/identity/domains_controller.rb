module Identity
  class DomainsController < ::DashboardController
    rescue_from "MonsoonOpenstackAuth::Authentication::NotAuthorized", with: :not_member_error
    authorization_required

    def show
      @root_projects = @user_domain_projects.reject{ |project| !project.parent.blank? }
    end

    def index
      @domains = services.identity.domains
    end

    def not_member_error
      # just catch the error and continue rendering
      render action: :show
    end
  end
end
