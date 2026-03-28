pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "StreetsAndroid"
include(":app")
include(":core-ui")
include(":core-network")
include(":core-database")
include(":feature-auth")
include(":feature-home")
include(":feature-search")
include(":feature-profile")
include(":feature-booking")
include(":feature-chat")
include(":feature-video")
include(":feature-wallet")
include(":feature-notifications")
include(":feature-settings")
include(":feature-reports")
