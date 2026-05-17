package com.techteam.udc.security.jwt;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.techteam.udc.security.PrincipalUsuario;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

// JWT firmado HS256: login genera token; el filtro valida cada peticion con la misma clave
@Component
public class JwtUtil {

	private final SecretKey signingKey;
	private final long expirationMillis;

	public JwtUtil(
			@Value("${jwt.secret}") String secret,
			@Value("${jwt.expiration}") long expirationMilliseconds) {
		byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
		if (keyBytes.length < 32) {
			throw new IllegalStateException("jwt.secret debe tener al menos 32 bytes UTF-8 para HS256");
		}
		this.signingKey = Keys.hmacShaKeyFor(keyBytes);
		this.expirationMillis = expirationMilliseconds;
	}

	// Cuanto dura el token en respuesta REST (aprox por redondeo a minutos enteros)
	public long getExpiresInApproxMinutes() {
		return Math.max(1, (expirationMillis + 59_999) / 60_000);
	}

	public String generateToken(PrincipalUsuario principal) {
		Instant now = Instant.now();
		Instant exp = now.plus(expirationMillis, ChronoUnit.MILLIS);
		return Jwts.builder()
				.subject(principal.getUsername())
				.claim("rol", principal.getRol().name())
				.issuedAt(Date.from(now))
				.expiration(Date.from(exp))
				.signWith(signingKey)
				.compact();
	}

	public Claims parseToken(String token) throws JwtException {
		return Jwts.parser()
				.verifyWith(signingKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public boolean validateToken(String rawToken, String usernameLoaded) throws JwtException {
		Claims c = parseToken(rawToken);
		return usernameLoaded.equals(c.getSubject()) && c.getExpiration().after(new Date());
	}
}
