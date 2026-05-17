package com.techteam.udc.security;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.techteam.udc.models.Rol;
import com.techteam.udc.models.Usuario;

// Envuelve nuestro Usuario cumpliendo el contrato UserDetails que pide Spring Security
public final class PrincipalUsuario implements UserDetails {

	private final Usuario usuario;

	public PrincipalUsuario(Usuario usuario) {
		this.usuario = usuario;
	}

	public Usuario getUsuario() {
		return usuario;
	}

	public Rol getRol() {
		return usuario.getRol();
	}

	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name()));
	}

	@Override
	public String getPassword() {
		return usuario.getPasswordHash();
	}

	@Override
	public String getUsername() {
		return usuario.getUsername();
	}

	@Override
	public boolean isEnabled() {
		return usuario.isEnabled();
	}

	@Override
	public boolean isAccountNonExpired() {
		return true;
	}

	@Override
	public boolean isAccountNonLocked() {
		return true;
	}

	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}
}
