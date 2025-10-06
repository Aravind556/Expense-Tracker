package com.example.Expense_Tracker.Service;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.Expense_Tracker.DTO.AuthResponse;
import com.example.Expense_Tracker.DTO.RegisterDTO;
import com.example.Expense_Tracker.DTO.UserDto;
import com.example.Expense_Tracker.Exception.DuplicateEmailException;
import com.example.Expense_Tracker.Exception.DuplicateUsernameException;
import com.example.Expense_Tracker.Exception.InvalidCredentialsException;
import com.example.Expense_Tracker.Exception.UserNotFoundException;
import com.example.Expense_Tracker.Model.User;
import com.example.Expense_Tracker.Repository.UserRepo;
import com.example.Expense_Tracker.Security.JwtService;

@Service
public class AuthService{

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;


   public AuthService(UserRepo userRepo, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtService jwtService) {
       this.userRepo = userRepo;
       this.passwordEncoder = passwordEncoder;
       this.authenticationManager = authenticationManager;
       this.jwtService = jwtService;
   }

   public AuthResponse register(RegisterDTO regdto){
        // Check if username already exists
        if (userRepo.existsByUsername(regdto.getUsername())) {
            throw new DuplicateUsernameException("Username '" + regdto.getUsername() + "' is already taken");
        }
        
        // Check if email already exists
        if (userRepo.existsByEmail(regdto.getEmail())) {
            throw new DuplicateEmailException("Email '" + regdto.getEmail() + "' is already registered");
        }

        User user = User.builder()
            .username(regdto.getUsername())
            .email(regdto.getEmail())
            .password(passwordEncoder.encode(regdto.getPassword()))
            .build();
        userRepo.save(user);

        String jwt = jwtService.generateToken(user);

        UserDto userDto = UserDto.builder()
            .username(user.getUsername())
            .password(null) // Don't send password back
            .build();

        return AuthResponse.builder()
            .token(jwt)
            .user(userDto)
            .build();
   }

   public AuthResponse authenticate(UserDto userDto){
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(userDto.getUsername(), userDto.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        var user = userRepo.findByUsername(userDto.getUsername())
            .orElseThrow(() -> new UserNotFoundException("User not found: " + userDto.getUsername()));

        String jwt = jwtService.generateToken(user);
        
        UserDto responseUserDto = UserDto.builder()
            .username(user.getUsername())
            .password(null) // Don't send password back
            .build();
        
        return AuthResponse.builder()
            .token(jwt)
            .user(responseUserDto)
            .build();
   }


   
}
