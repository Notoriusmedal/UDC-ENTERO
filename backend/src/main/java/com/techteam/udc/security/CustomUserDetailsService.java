package com.techteam.udc.security;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.UsuarioRepository;

// Spring Security llama aqui tras validar JWT para cargar usuario y roles desde la BD
@Service
public class CustomUserDetailsService implements UserDetailsService {

	private final UsuarioRepository UR;

	public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
		this.UR = usuarioRepository;
	}

	@Override
	@Transactional(readOnly = true)
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
		Usuario u = UR.findByUsername(username)
				.orElseThrow(() -> new UsernameNotFoundException(username));
		return new PrincipalUsuario(u);
	}
}
