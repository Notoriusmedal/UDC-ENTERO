package com.techteam.udc.security;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

// Habilita peticiones desde el frontend si corre en otro origen que el backend
@Configuration
public class CorsConfig {

	// Ej. localhost:4200; se pueden sumar mas en cors.extra-allowed-origins separados por coma
	@Value("${cors.allowed-origin:http://localhost:4200}")
	private String allowedOrigin;

	@Value("${cors.extra-allowed-origins:}")
	private String extraAllowedOrigins;

	@Value("${cors.allowed-origin-patterns:https://*.vercel.app}")
	private String allowedOriginPatterns;

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		List<String> origins = Arrays.stream((allowedOrigin + "," + extraAllowedOrigins).split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.collect(Collectors.toList());
		List<String> originPatterns = Arrays.stream(allowedOriginPatterns.split(","))
				.map(String::trim)
				.filter(s -> !s.isEmpty())
				.collect(Collectors.toList());
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(origins);
		config.setAllowedOriginPatterns(originPatterns);
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setExposedHeaders(List.of("Authorization"));
		config.setAllowCredentials(true);
		var source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}
}
