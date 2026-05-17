package com.techteam.udc.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techteam.udc.models.Notificacion;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

	List<Notificacion> findByDestinatario_IdOrderByCreadoEnDesc(Long destinatarioId);

	long countByDestinatario_IdAndLeidaFalse(Long destinatarioId);
}
