package com.techteam.udc.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.techteam.udc.models.FranjaConvocatoria;

public interface FranjaConvocatoriaRepository extends JpaRepository<FranjaConvocatoria, Long> {

	List<FranjaConvocatoria> findByArbitro_IdOrderByInicioAsc(Long arbitroId);

	void deleteByArbitro_Id(Long arbitroId);
}
