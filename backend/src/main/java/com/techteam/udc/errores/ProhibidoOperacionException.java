package com.techteam.udc.errores;

public class ProhibidoOperacionException extends RuntimeException {

	public ProhibidoOperacionException(String mensaje) {
		super(mensaje);
	}
}
