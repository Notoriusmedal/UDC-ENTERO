package com.techteam.udc.models;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "instalacion")
public class Instalacion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 200)
	private String nombre;

	// Ubicacion en texto; lat/long opcionales para distancias Haversine
	@Column(length = 500)
	private String ubicacionTexto;

	@Column(nullable = true)
	private Double latitud;

	@Column(nullable = true)
	private Double longitud;

	protected Instalacion() {
	}

	public Instalacion(String nombre, String ubicacionTexto, Double latitud, Double longitud) {
		this.nombre = nombre;
		this.ubicacionTexto = ubicacionTexto;
		this.latitud = latitud;
		this.longitud = longitud;
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

	public String getUbicacionTexto() {
		return ubicacionTexto;
	}

	public void setUbicacionTexto(String ubicacionTexto) {
		this.ubicacionTexto = ubicacionTexto;
	}

	public Double getLatitud() {
		return latitud;
	}

	public void setLatitud(Double latitud) {
		this.latitud = latitud;
	}

	public Double getLongitud() {
		return longitud;
	}

	public void setLongitud(Double longitud) {
		this.longitud = longitud;
	}
}
