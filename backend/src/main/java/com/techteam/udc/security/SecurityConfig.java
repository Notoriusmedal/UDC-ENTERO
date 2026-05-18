package com.techteam.udc.security;

import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import com.techteam.udc.security.jwt.JwtAuthenticationFilter;

import jakarta.servlet.http.HttpServletResponse;

// Cerebro HTTP: rutas publicas vs JWT, CORS, sin sesion y filtro Bearer antes del login de Spring
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

	@SuppressWarnings("unused")
	private final PasswordEncoder passwordEncoder;

	@Autowired
	private JwtAuthenticationFilter jwtAuthenticationFilter;

	public SecurityConfig(@Qualifier("miPEcontraseñaApp") PasswordEncoder passwordEncoder) {
		this.passwordEncoder = passwordEncoder;
	}

	// Lo usa AuthController para validar usuario y clave en el login
	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
		return configuration.getAuthenticationManager();
	}

	// Cadena de filtros: CORS, sin CSRF (JWT stateless), sin sesion, reglas por URL, filtro JWT primero
	@Bean
	public SecurityFilterChain securityFilterChain(
			HttpSecurity http,
			CorsConfigurationSource corsConfigurationSource)
			throws Exception {
		http
				.cors(c -> c.configurationSource(corsConfigurationSource))
				.csrf(AbstractHttpConfigurer::disable)
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll()
						.requestMatchers("/api/public/**").permitAll()
						.requestMatchers("/h2-console/**").permitAll()
						.requestMatchers("/error").permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(ex -> ex
						.authenticationEntryPoint((request, response, authException) -> {
							response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
							response.setCharacterEncoding(StandardCharsets.UTF_8.name());
							response.setContentType("application/json");
							response.getWriter().write(
									"{\"codigo\":\"NO_AUTENTICADO\",\"mensaje\":\"Requiere autenticacion\"}");
						}))
				.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}
