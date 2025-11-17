package com.synergy.bokja.repository;

import com.synergy.bokja.entity.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {
    UserEntity findByUno(Long uno);
    UserEntity findByNameAndBirthAndPhone(String name, LocalDate birth, String phone);
    List<UserEntity> findAllByIsActive(Boolean isActive);
}
