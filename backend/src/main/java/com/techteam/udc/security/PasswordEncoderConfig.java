package com.techteam.udc.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class PasswordEncoderConfig {

	// Un solo encoder con nombre fijo para inyectarlo con @Qualifier en servicios que hashean claves
	@Bean(name = "miPEcontraseñaApp")
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
