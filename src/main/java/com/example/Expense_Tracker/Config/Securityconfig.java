package com.example.Expense_Tracker.Config;

import java.text.Normalizer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

import com.example.Expense_Tracker.Service.UserService;


@Configuration
@EnableWebSecurity
public class Securityconfig {

    
    public UserService userService;

    public Securityconfig(UserService userService) {
        this.userService = userService;
    }

    @Bean
    public UserDetailsService userDetailsService(){
        return userService;
    }


    
    

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf-> csrf.disable())
            .authorizeHttpRequests(
                auth -> auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/api/expenses/**").authenticated()
                    .anyRequest().authenticated()
            );
        
            
        
        
        
        return http.build();

    }
}
