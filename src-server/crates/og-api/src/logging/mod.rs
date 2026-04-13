use og_core::config::LoggingConfig;
use tracing_subscriber::{
    fmt::{self, format::FmtSpan},
    layer::SubscriberExt,
    util::SubscriberInitExt,
    EnvFilter,
};

pub fn init_logging(config: &LoggingConfig) {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        // release 构建时静态最大级别为 info，避免配置 debug 导致 warning
        let root_level = if cfg!(debug_assertions) {
            config.level.clone()
        } else {
            "info".into()
        };
        let mut filter = EnvFilter::new(root_level);
        for m in &config.filter_modules {
            filter = filter.add_directive(
                format!("{}={}", m.target, m.level)
                    .parse()
                    .expect("valid filter directive"),
            );
        }
        filter
    });

    let fmt_layer = fmt::layer()
        .with_target(true)
        .with_span_events(FmtSpan::CLOSE);

    match config.format.as_str() {
        "json" => tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt_layer.json())
            .init(),
        "compact" => tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt_layer.compact())
            .init(),
        _ => tracing_subscriber::registry()
            .with(env_filter)
            .with(fmt_layer.pretty())
            .init(),
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use og_core::config::LoggingConfig;

    fn make_config(level: &str, format: &str) -> LoggingConfig {
        LoggingConfig {
            level: level.into(),
            format: format.into(),
            filter_modules: vec![],
        }
    }

    #[test]
    fn test_init_logging_pretty() {
        let config = make_config("info", "pretty");
        // 第一次 init 会成功，但如果其他测试也 init 就会 panic
        // 在测试里我们 catch 掉 "SetGlobalDefaultError"
        let result = std::panic::catch_unwind(|| init_logging(&config));
        assert!(result.is_ok() || is_already_set_error(&result));
    }

    #[test]
    fn test_init_logging_json() {
        let config = make_config("warn", "json");
        let result = std::panic::catch_unwind(|| init_logging(&config));
        assert!(result.is_ok() || is_already_set_error(&result));
    }

    #[test]
    fn test_init_logging_compact() {
        let config = make_config("debug", "compact");
        let result = std::panic::catch_unwind(|| init_logging(&config));
        assert!(result.is_ok() || is_already_set_error(&result));
    }

    fn is_already_set_error(result: &std::thread::Result<()>) -> bool {
        match result {
            Err(e) => {
                if let Some(s) = e.downcast_ref::<&str>() {
                    s.contains("global default subscriber")
                } else if let Some(s) = e.downcast_ref::<String>() {
                    s.contains("global default subscriber")
                } else {
                    false
                }
            }
            Ok(()) => false,
        }
    }
}
