package com.internportal.backend.repository;

import com.internportal.backend.domain.entity.User;
import com.internportal.backend.domain.enums.AccountStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByStatus(AccountStatus status);
    long countByRole(com.internportal.backend.domain.entity.Role role);
    long countByRoleAndStatusAndDeletedFalse(com.internportal.backend.domain.entity.Role role, AccountStatus status);
}
