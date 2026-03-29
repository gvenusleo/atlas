use std::fs;
use std::path::{Path, PathBuf};

use serde::{Deserialize, Serialize};

use crate::core::error::AtlasError;

const CONFIG_DIR_OVERRIDE: &str = "ATLAS_CONFIG_DIR";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct AppConfig {
    pub base_url: String,
    pub token: String,
    pub auth_type: String,
}

#[derive(Debug, Clone)]
pub struct ConfigStore {
    path: PathBuf,
}

impl Default for ConfigStore {
    fn default() -> Self {
        let base_dir = std::env::var_os(CONFIG_DIR_OVERRIDE)
            .map(PathBuf::from)
            .or_else(dirs::config_dir)
            .unwrap_or_else(|| PathBuf::from("."));

        Self::new(base_dir.join("atlas").join("config.toml"))
    }
}

impl ConfigStore {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn load(&self) -> Result<AppConfig, AtlasError> {
        if !self.path.exists() {
            return Err(AtlasError::MissingConfig);
        }

        let raw = fs::read_to_string(&self.path).map_err(|err| AtlasError::Config {
            path: self.path.clone(),
            message: err.to_string(),
        })?;

        toml::from_str(&raw).map_err(|err| AtlasError::Config {
            path: self.path.clone(),
            message: err.to_string(),
        })
    }

    pub fn save(&self, config: &AppConfig) -> Result<(), AtlasError> {
        let parent = self.path.parent().ok_or_else(|| AtlasError::Config {
            path: self.path.clone(),
            message: "配置文件路径无效".to_owned(),
        })?;

        fs::create_dir_all(parent).map_err(|err| AtlasError::Config {
            path: self.path.clone(),
            message: err.to_string(),
        })?;

        let rendered = toml::to_string_pretty(config).map_err(|err| AtlasError::Config {
            path: self.path.clone(),
            message: err.to_string(),
        })?;

        fs::write(&self.path, rendered).map_err(|err| AtlasError::Config {
            path: self.path.clone(),
            message: err.to_string(),
        })
    }
}

#[cfg(test)]
mod tests {
    use tempfile::tempdir;

    use super::{AppConfig, ConfigStore};

    #[test]
    fn saves_and_loads_config_roundtrip() {
        let dir = tempdir().unwrap();
        let store = ConfigStore::new(dir.path().join("atlas").join("config.toml"));
        let config = AppConfig {
            base_url: "http://127.0.0.1:8090".to_owned(),
            token: "token-123".to_owned(),
            auth_type: "superuser".to_owned(),
        };

        store.save(&config).unwrap();
        let loaded = store.load().unwrap();

        assert_eq!(loaded, config);
    }
}
