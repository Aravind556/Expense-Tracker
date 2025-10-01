package com.example.Expense_Tracker.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.Expense_Tracker.Repository.UserRepo;

@Component
public class Webconfig {

    private final UserRepo userRepo;

    public Webconfig(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
    @Bean
    public UserDetailsService userDetailsService(){
        return username -> 
            userRepo.findByUsername(username)
            .orElseThrow(()-> new UsernameNotFoundException(username + " not found"));
        
    }
    
}
