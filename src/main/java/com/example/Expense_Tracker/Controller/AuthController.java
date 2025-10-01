package com.example.Expense_Tracker.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Expense_Tracker.DTO.AuthResponse;
import com.example.Expense_Tracker.DTO.RegisterDTO;
import com.example.Expense_Tracker.DTO.UserDto;
import com.example.Expense_Tracker.Service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {


    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }


    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@RequestBody RegisterDTO regdto) {
        AuthResponse resp = authService.register(regdto);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/login") 
    public ResponseEntity<AuthResponse> loginUser(@RequestBody UserDto userDto) {
        AuthResponse resp = authService.authenticate(userDto);
        return ResponseEntity.ok(resp);
    }
    
}
