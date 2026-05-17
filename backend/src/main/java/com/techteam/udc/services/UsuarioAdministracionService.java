package com.techteam.udc.services;

import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techteam.udc.dto.UsuarioActualizarAdminRequest;
import com.techteam.udc.dto.UsuarioAltaAdminRequest;
import com.techteam.udc.dto.UsuarioListaRespuesta;
import com.techteam.udc.errores.ProhibidoOperacionException;
import com.techteam.udc.errores.RecursoNoEncontradoException;
import com.techteam.udc.errores.ReglaNegocioException;
import com.techteam.udc.models.Rol;
import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.UsuarioRepository;

@Service
@Transactional
public class UsuarioAdministracionService {

	private final UsuarioRepository usuarioRepository;
	private final PasswordEncoder passwordEncoder;

	public UsuarioAdministracionService(
			UsuarioRepository usuarioRepository,
			@Qualifier("miPEcontraseñaApp") PasswordEncoder passwordEncoder) {
		this.usuarioRepository = usuarioRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional(readOnly = true)
	public List<UsuarioListaRespuesta> listarTodos() {
		return usuarioRepository.findAll().stream()
				.sorted(Comparator.comparing(u -> u.getUsername().toLowerCase()))
				.map(this::mapearLista)
				.toList();
	}

	public UsuarioListaRespuesta crear(UsuarioAltaAdminRequest req) {
		String username = req.username().trim();
		String correo = req.correo().trim().toLowerCase();
		String doc = req.documentoIdentidad().trim();

		validarCreacionSinDuplicados(username, correo, doc);

		boolean convocable = req.rol() == Rol.ARBITRO && req.convocableParaSeleccionArbitral();
		Usuario u = new Usuario(
				username,
				passwordEncoder.encode(req.passwordClaro()),
				req.nombre().trim(),
				req.apellidos().trim(),
				correo,
				doc,
				req.telefono().trim(),
				req.rol(),
				true,
				convocable);

		u = usuarioRepository.save(u);
		return mapearLista(u);
	}

	public UsuarioListaRespuesta actualizar(Long id, UsuarioActualizarAdminRequest req) {
		Usuario u = usuarioRepository.findById(id).orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));

		String nextCorreo = req.correo() != null ? req.correo().trim().toLowerCase() : u.getCorreo();
		if (!nextCorreo.equals(u.getCorreo())) {
			if (usuarioRepository.existsByCorreoAndIdNot(nextCorreo, u.getId())) {
				throw new ReglaNegocioException("El correo ya pertenece a otro usuario");
			}
			u.setCorreo(nextCorreo);
		}

		if (req.passwordClaroOpcional() != null) {
			u.setPasswordHash(passwordEncoder.encode(req.passwordClaroOpcional()));
		}
		if (req.nombre() != null) {
			u.setNombre(req.nombre().trim());
		}
		if (req.apellidos() != null) {
			u.setApellidos(req.apellidos().trim());
		}
		if (req.telefono() != null) {
			u.setTelefono(req.telefono().trim());
		}
		if (req.rol() != null) {
			u.setRol(req.rol());
			if (u.getRol() != Rol.ARBITRO && u.isConvocableParaSeleccionArbitral()) {
				u.setConvocableParaSeleccionArbitral(false);
			}
		}
		if (req.enabled() != null) {
			u.setEnabled(req.enabled());
			if (Boolean.FALSE.equals(req.enabled())) {
				u.setConvocableParaSeleccionArbitral(false);
			}
		}
		if (req.convocableParaSeleccionArbitral() != null) {
			u.setConvocableParaSeleccionArbitral(Boolean.TRUE.equals(req.convocableParaSeleccionArbitral())
					&& u.getRol() == Rol.ARBITRO);
		}

		return mapearLista(u);
	}

	public UsuarioListaRespuesta establecerBanderaConvocatoria(Long objetivoUsuarioId, boolean valor, Usuario actor) {
		Usuario objetivo = usuarioRepository.findById(objetivoUsuarioId)
				.orElseThrow(() -> new RecursoNoEncontradoException("Usuario no encontrado"));
		if (objetivo.getRol() != Rol.ARBITRO) {
			throw new ReglaNegocioException("La bandera de convocatoria solo aplica a usuarios con rol ARBITRO");
		}
		if (actor.getRol() != Rol.ADMIN && actor.getRol() != Rol.COORDINADOR_ARBITROS) {
			throw new ProhibidoOperacionException("No puedes cambiar esa bandera");
		}
		objetivo.setConvocableParaSeleccionArbitral(valor && objetivo.isEnabled());
		return mapearLista(objetivo);
	}

	private void validarCreacionSinDuplicados(String username, String correo, String doc) {
		if (usuarioRepository.existsByUsername(username)) {
			throw new ReglaNegocioException("El nombre de usuario ya existe");
		}
		if (usuarioRepository.existsByCorreo(correo)) {
			throw new ReglaNegocioException("El correo ya existe");
		}
		if (usuarioRepository.existsByDocumentoIdentidad(doc)) {
			throw new ReglaNegocioException("El documento de identidad ya existe");
		}
	}

	private UsuarioListaRespuesta mapearLista(Usuario u) {
		return new UsuarioListaRespuesta(
				u.getId(),
				u.getUsername(),
				u.getNombre(),
				u.getApellidos(),
				u.getCorreo(),
				u.getRol(),
				u.isEnabled(),
				u.isConvocableParaSeleccionArbitral());
	}
}
