package com.techteam.udc.security.jwt;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Extrae Bearer del header Authorization y deja autenticado al usuario si el token es valido
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	private final JwtUtil JWTU;
	private final UserDetailsService UDS;

	public JwtAuthenticationFilter(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
		this.JWTU = jwtUtil;
		this.UDS = userDetailsService;
	}

	@Override
	protected void doFilterInternal(
			@NonNull HttpServletRequest request,
			@NonNull HttpServletResponse response,
			@NonNull FilterChain filterChain) throws ServletException, IOException {

		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (!StringUtils.hasText(header) || !header.startsWith("Bearer ")) {
			filterChain.doFilter(request, response);
			return;
		}

		String raw = header.substring(7).trim();
		if (!StringUtils.hasText(raw)) {
			filterChain.doFilter(request, response);
			return;
		}

		try {
			var claims = JWTU.parseToken(raw);
			String username = claims.getSubject();
			if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
				UserDetails user = UDS.loadUserByUsername(username);
				if (!JWTU.validateToken(raw, user.getUsername())) {
					filterChain.doFilter(request, response);
					return;
				}
				var auth = new UsernamePasswordAuthenticationToken(
						user,
						null,
						user.getAuthorities());
				auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
				SecurityContextHolder.getContext().setAuthentication(auth);
			}
		}
		catch (JwtException ex) {
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			response.setCharacterEncoding(StandardCharsets.UTF_8.name());
			response.setContentType("application/json");
			response.getWriter().write(
					"{\"codigo\":\"TOKEN_INVALIDO\",\"mensaje\":\"Token invalido o expirado\"}");
			return;
		}

		filterChain.doFilter(request, response);
	}
}
