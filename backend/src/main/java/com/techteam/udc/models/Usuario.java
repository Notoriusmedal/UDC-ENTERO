package com.techteam.udc.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuario")
public class Usuario {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 64)
	private String username;

	@Column(name = "password_hash", nullable = false, length = 120)
	private String passwordHash;

	@Column(nullable = false, length = 120)
	private String nombre;

	@Column(nullable = false, length = 120)
	private String apellidos;

	@Column(nullable = false, unique = true, length = 180)
	private String correo;

	@Column(nullable = false, unique = true, length = 32)
	private String documentoIdentidad;

	@Column(nullable = false, length = 40)
	private String telefono;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 40)
	private Rol rol;

	@Column(nullable = false)
	private boolean enabled = true;

	// Solo aplica bien a ARBITRO: si puede salir elegido cuando coordinacion arma partido
	@Column(nullable = false)
	private boolean convocableParaSeleccionArbitral;

	@Column(name = "categoria_arbitral", length = 40)
	private String categoriaArbitral = "LOCAL";

	@Column(name = "licencia_arbitral", length = 80)
	private String licenciaArbitral;

	@Column(name = "disponibilidad_arbitral", length = 40)
	private String disponibilidadArbitral = "DISPONIBLE";

	@Column(name = "competencias_arbitrales", length = 500)
	private String competenciasArbitrales = "FUTBOL";

	@Column(name = "observaciones_arbitro", length = 1000)
	private String observacionesArbitro;

	protected Usuario() {
	}

	public Usuario(String username, String passwordHash, String nombre, String apellidos,
			String correo, String documentoIdentidad, String telefono, Rol rol, boolean enabled,
			boolean convocableParaSeleccionArbitral) {
		this.username = username;
		this.passwordHash = passwordHash;
		this.nombre = nombre;
		this.apellidos = apellidos;
		this.correo = correo;
		this.documentoIdentidad = documentoIdentidad;
		this.telefono = telefono;
		this.rol = rol;
		this.enabled = enabled;
		this.convocableParaSeleccionArbitral = convocableParaSeleccionArbitral;
	}

	public Long getId() {
		return id;
	}

	public String getUsername() {
		return username;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public Rol getRol() {
		return rol;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public boolean isConvocableParaSeleccionArbitral() {
		return convocableParaSeleccionArbitral;
	}

	public String getNombre() {
		return nombre;
	}

	public String getApellidos() {
		return apellidos;
	}

	public String getCorreo() {
		return correo;
	}

	public String getDocumentoIdentidad() {
		return documentoIdentidad;
	}

	public String getTelefono() {
		return telefono;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public void setApellidos(String apellidos) {
		this.apellidos = apellidos;
	}

	public void setCorreo(String correo) {
		this.correo = correo;
	}

	public void setDocumentoIdentidad(String documentoIdentidad) {
		this.documentoIdentidad = documentoIdentidad;
	}

	public void setTelefono(String telefono) {
		this.telefono = telefono;
	}

	public void setRol(Rol rol) {
		this.rol = rol;
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public void setConvocableParaSeleccionArbitral(boolean convocableParaSeleccionArbitral) {
		this.convocableParaSeleccionArbitral = convocableParaSeleccionArbitral;
	}

	public String getCategoriaArbitral() {
		return categoriaArbitral;
	}

	public void setCategoriaArbitral(String categoriaArbitral) {
		this.categoriaArbitral = categoriaArbitral;
	}

	public String getLicenciaArbitral() {
		return licenciaArbitral;
	}

	public void setLicenciaArbitral(String licenciaArbitral) {
		this.licenciaArbitral = licenciaArbitral;
	}

	public String getDisponibilidadArbitral() {
		return disponibilidadArbitral;
	}

	public void setDisponibilidadArbitral(String disponibilidadArbitral) {
		this.disponibilidadArbitral = disponibilidadArbitral;
	}

	public String getCompetenciasArbitrales() {
		return competenciasArbitrales;
	}

	public void setCompetenciasArbitrales(String competenciasArbitrales) {
		this.competenciasArbitrales = competenciasArbitrales;
	}

	public String getObservacionesArbitro() {
		return observacionesArbitro;
	}

	public void setObservacionesArbitro(String observacionesArbitro) {
		this.observacionesArbitro = observacionesArbitro;
	}
}
