module Identity
  class ProjectsController < DashboardController
    before_filter :get_project_id,  except: [:index, :create, :new]
    before_filter do
      @scoped_project_fid = params[:project_id] || @project_id
    end
    
    rescue_from "MonsoonOpenstackAuth::Authentication::NotAuthorized", with: :not_member_error
    
    def not_member_error(exception)
      if params[:action]=='index'
        @projects = Admin::IdentityService.projects_by_user_id(current_user.id)  
        respond_to do |format|
          format.js {render action: params[:action], formats:[:js]}
          format.html {render action: params[:action]}
        end
      else
        raise(exception)
      end
    end 

    def index
      @projects = services.identity.auth_projects(@scoped_domain_id)
      
      respond_to do |format|
        format.html { 
          if params[:partial]
            render partial: 'projects', locals: {projects: @projects, remote_links: true}, layout: false
          else
            render action: :index 
          end
        }
        format.js
      end

    end

    def show
      @current_project = services.identity.find_project(@project_id, :subtree_as_list)
      @instances = services.compute.servers(tenant_id: @current_project.id) rescue []
    end
    
    def destroy
      project = services.identity.find_project(@project_id)
      
      if project.destroy
        flash[:notice] = "Project successfully deleted."
      else
        flash[:error] = project.errors.full_messages.to_sentence #"Something when wrong when trying to delete the project"
      end

      redirect_to projects_path
    end

    private

    def get_project_id
      @project_id = params[:id] || params[:project_id]
      entry = FriendlyIdEntry.find_by_class_scope_and_key_or_slug('Project',@scoped_domain_id,@project_id)
      @project_id = entry.key if entry
    end
  end
end
