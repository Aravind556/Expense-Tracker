package com.example.Expense_Tracker.Repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.Expense_Tracker.Model.User;

public interface UserRepo extends JpaRepository<User,Long>{
    User findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}
