terraform {
  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 0.4"
    }
  }
}

provider "vercel" {
  # Configure with VERCEL_TOKEN environment variable
}

resource "vercel_project" "energy_drink_app" {
  name      = "energy-drink-app"
  framework = "nextjs"

  git_repository = {
    type = "github"
    repo = "your-org/energy-drink-app"  # Replace with actual repo
  }

  environment = [
    {
      key   = "NODE_ENV"
      value = "production"
    }
  ]

  build_command = "npm run build"
  dev_command   = "npm run dev"
  install_command = "npm install"
}

resource "vercel_deployment" "production" {
  project_id = vercel_project.energy_drink_app.id
  ref        = "main"

  production = true

  environment = {
    NODE_ENV = "production"
  }
}

# Domain configuration
resource "vercel_domain" "app_domain" {
  name = "your-domain.com"  # Replace with actual domain
}

resource "vercel_project_domain" "app_project_domain" {
  project_id = vercel_project.energy_drink_app.id
  domain     = vercel_domain.app_domain.name
}