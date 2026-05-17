package com.techteam.udc.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "equipo")
public class Equipo {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 160)
	private String nombre;

	// Escudo opcional solo como texto hasta tener subida de ficheros
	@Column(length = 500)
	private String escudoEtiqueta;

	protected Equipo() {
	}

	public Equipo(String nombre, String escudoEtiqueta) {
		this.nombre = nombre;
		this.escudoEtiqueta = escudoEtiqueta;
	}

	public Long getId() {
		return id;
	}

	public String getNombre() {
		return nombre;
	}

	public void setNombre(String nombre) {
		this.nombre = nombre;
	}

	public String getEscudoEtiqueta() {
		return escudoEtiqueta;
	}

	public void setEscudoEtiqueta(String escudoEtiqueta) {
		this.escudoEtiqueta = escudoEtiqueta;
	}
}
