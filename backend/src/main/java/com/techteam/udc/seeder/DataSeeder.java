package com.techteam.udc.seeder;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

import com.techteam.udc.models.Equipo;
import com.techteam.udc.models.EstadoPartido;
import com.techteam.udc.models.Instalacion;
import com.techteam.udc.models.Partido;
import com.techteam.udc.models.Rol;
import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.EquipoRepository;
import com.techteam.udc.repositories.InstalacionRepository;
import com.techteam.udc.repositories.PartidoRepository;
import com.techteam.udc.repositories.UsuarioRepository;

import org.springframework.boot.CommandLineRunner;

// Corre al arrancar si udc.bootstrap.dev-users=true; inserta admin demo si la tabla usuario esta vacia
@Component
@ConditionalOnProperty(name = "udc.bootstrap.dev-users", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

	private final UsuarioRepository UR;
	private final EquipoRepository ER;
	private final InstalacionRepository IR;
	private final PartidoRepository PR;
	private final PasswordEncoder PE;

	@Value("${udc.bootstrap.admin.username}")
	private String adminUsername;

	@Value("${udc.bootstrap.admin.password}")
	private String adminPassword;

	public DataSeeder(UsuarioRepository usuarioRepository,
			EquipoRepository equipoRepository,
			InstalacionRepository instalacionRepository,
			PartidoRepository partidoRepository,
			@Qualifier("miPEcontraseñaApp") PasswordEncoder passwordEncoder) {
		this.UR = usuarioRepository;
		this.ER = equipoRepository;
		this.IR = instalacionRepository;
		this.PR = partidoRepository;
		this.PE = passwordEncoder;
	}

	@Override
	public void run(String... args) {
		seedUsuariosDemo();
		seedCatalogoYPartidosDemo();
	}

	private void seedUsuariosDemo() {
		crearUsuarioSiNoExiste(adminUsername.trim(), adminPassword, "Administrador", "Sistema",
				adminUsername.trim().toLowerCase() + "@udc.dev", "00000000A", "000000000",
				Rol.ADMIN, false, null, null, null);

		crearUsuarioSiNoExiste("organizador", "1234", "Laura", "Martín",
				"organizador@udc.dev", "00000001B", "600000001",
				Rol.ORGANIZADOR, false, null, null, null);

		crearUsuarioSiNoExiste("coordinador", "1234", "Carlos", "Pérez",
				"coordinador@udc.dev", "00000002C", "600000002",
				Rol.COORDINADOR_ARBITROS, false, null, null, null);

		crearUsuarioSiNoExiste("espectador", "1234", "Nayra", "Ramos",
				"espectador@udc.dev", "00000006G", "600000006",
				Rol.ESPECTADOR, false, null, null, null);

		crearUsuarioSiNoExiste("arbitro", "1234", "Miguel", "González",
				"arbitro@udc.dev", "00000003D", "600000003",
				Rol.ARBITRO, true, "REGIONAL", "UDC-ARB-001", "FUTBOL,BALONMANO");

		crearUsuarioSiNoExiste("arbitro2", "1234", "Sara", "Rodríguez",
				"arbitro2@udc.dev", "00000004E", "600000004",
				Rol.ARBITRO, true, "NACIONAL", "UDC-ARB-002", "FUTBOL,BALONCESTO");

		crearUsuarioSiNoExiste("arbitro3", "1234", "Diego", "Suárez",
				"arbitro3@udc.dev", "00000005F", "600000005",
				Rol.ARBITRO, true, "PROVINCIAL", "UDC-ARB-003", "FUTBOL,VOLEIBOL");
	}

	private void seedCatalogoYPartidosDemo() {
		Equipo local = ER.findByNombreIgnoreCase("UDC Norte")
				.orElseGet(() -> ER.save(new Equipo("UDC Norte", null)));
		Equipo visitante = ER.findByNombreIgnoreCase("UDC Sur")
				.orElseGet(() -> ER.save(new Equipo("UDC Sur", null)));
		IR.findFirstByNombreIgnoreCase("Pabellón Central")
				.orElseGet(() -> IR.save(new Instalacion("Pabellón Central", "Santa Cruz de Tenerife", null, null)));

		if (PR.count() > 0) {
			return;
		}
		Instalacion instalacion = IR.findFirstByNombreIgnoreCase("Pabellón Central").orElseThrow();
		Usuario organizador = UR.findByUsername("organizador").orElseThrow();
		Partido partido = new Partido(
				local,
				visitante,
				instalacion,
				organizador,
				LocalDateTime.now().plusDays(2).withHour(18).withMinute(30).withSecond(0).withNano(0),
				null,
				EstadoPartido.PROGRAMADO,
				3);
		partido.setDeporte("FUTBOL");
		partido.setCompeticion("Liga Insular");
		partido.setObservaciones("Partido demo para probar frontend y backend juntos.");
		PR.save(partido);
	}

	private void crearUsuarioSiNoExiste(String username, String password, String nombre, String apellidos,
			String correo, String documento, String telefono, Rol rol, boolean convocable,
			String categoria, String licencia, String competencias) {
		if (UR.existsByUsername(username)) {
			return;
		}
		Usuario usuario = new Usuario(
				username,
				PE.encode(password),
				nombre,
				apellidos,
				correo,
				documento,
				telefono,
				rol,
				true,
				rol == Rol.ARBITRO && convocable);
		if (rol == Rol.ARBITRO) {
			usuario.setCategoriaArbitral(categoria != null ? categoria : "LOCAL");
			usuario.setLicenciaArbitral(licencia);
			usuario.setDisponibilidadArbitral("DISPONIBLE");
			usuario.setCompetenciasArbitrales(competencias != null ? competencias : "FUTBOL");
		}
		UR.save(usuario);
	}
}
