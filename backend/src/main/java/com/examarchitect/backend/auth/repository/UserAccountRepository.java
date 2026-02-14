package com.examarchitect.backend.auth.repository;

import com.examarchitect.backend.auth.model.UserAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserAccountRepository extends JpaRepository<UserAccount, String> {

  Optional<UserAccount> findByEmailIgnoreCase(String email);

  boolean existsByEmailIgnoreCase(String email);
}
