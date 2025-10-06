package com.example.Expense_Tracker.Controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.Expense_Tracker.DTO.AuthResponse;
import com.example.Expense_Tracker.DTO.RegisterDTO;
import com.example.Expense_Tracker.DTO.UserDto;
import com.example.Expense_Tracker.Security.JwtService;
import com.example.Expense_Tracker.Service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final JwtService jwtService;
    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }


    @PostMapping("/register")
    public ResponseEntity<String> registerUser(@RequestBody RegisterDTO regdto) {
        try {
            // Input validation
            if (regdto == null) {
                return ResponseEntity.status(400).body("Registration data is required");
            }
            if (regdto.getUsername() == null || regdto.getUsername().trim().isEmpty()) {
                return ResponseEntity.status(400).body("Username is required");
            }
            if (regdto.getPassword() == null || regdto.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(400).body("Password is required");
            }
            if (regdto.getEmail() == null || regdto.getEmail().trim().isEmpty()) {
                return ResponseEntity.status(400).body("Email is required");
            }
            
            logger.info("Registration request received - Username: {}, Email: {}", regdto.getUsername(), regdto.getEmail());
            AuthResponse resp = authService.register(regdto);
            logger.info("Registration successful for username: {}", regdto.getUsername());
            
            // Create httpOnly cookie for JWT token
            ResponseCookie jwtCookie = ResponseCookie.from("authToken", resp.getToken())
                    .httpOnly(true)
                    .secure(false) // Set to true in production with HTTPS
                    .path("/")
                    .maxAge(24 * 60 * 60) // 24 hours
                    .sameSite("Lax")
                    .build();
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                    .body("Registration successful! Redirecting to dashboard...");
        } catch (Exception e) {
            logger.error("Registration failed for username: {} with error: {}", regdto.getUsername(), e.getMessage(), e);
            
            // Provide more specific error messages
            String errorMessage = "Registration failed";
            if (e.getMessage().contains("username")) {
                errorMessage = "Username already exists. Please choose a different username.";
            } else if (e.getMessage().contains("email")) {
                errorMessage = "Email address already registered. Please use a different email.";
            } else if (e.getMessage().contains("password")) {
                errorMessage = "Password does not meet requirements.";
            } else if (e.getMessage() != null && !e.getMessage().isEmpty()) {
                errorMessage = "Registration failed: " + e.getMessage();
            }
            
            return ResponseEntity.status(400).body(errorMessage);
        }
    }

    @PostMapping("/login") 
    public ResponseEntity<String> loginUser(@RequestBody UserDto userDto) {
        try {
            // Input validation
            if (userDto == null) {
                return ResponseEntity.status(400).body("Login credentials are required");
            }
            if (userDto.getUsername() == null || userDto.getUsername().trim().isEmpty()) {
                return ResponseEntity.status(400).body("Username is required");
            }
            if (userDto.getPassword() == null || userDto.getPassword().trim().isEmpty()) {
                return ResponseEntity.status(400).body("Password is required");
            }
            
            logger.info("Login request received for username: {}", userDto.getUsername());
            AuthResponse resp = authService.authenticate(userDto);
            logger.info("Login successful for username: {}", userDto.getUsername());
            
            // Create httpOnly cookie for JWT token
            ResponseCookie jwtCookie = ResponseCookie.from("authToken", resp.getToken())
                    .httpOnly(true)
                    .secure(false) // Set to true in production with HTTPS
                    .path("/")
                    .maxAge(24 * 60 * 60) // 24 hours
                    .sameSite("Lax")
                    .build();
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                    .body("Login successful! Redirecting to dashboard...");
        } catch (Exception e) {
            logger.error("Login failed for username: {} with error: {}", userDto.getUsername(), e.getMessage(), e);
            
            // Provide more specific error messages
            String errorMessage = "Login failed";
            if (e.getMessage().contains("Bad credentials") || e.getMessage().contains("password")) {
                errorMessage = "Invalid username or password. Please check your credentials and try again.";
            } else if (e.getMessage().contains("disabled")) {
                errorMessage = "Account is disabled. Please contact support.";
            } else if (e.getMessage().contains("locked")) {
                errorMessage = "Account is locked. Please contact support.";
            } else if (e.getMessage() != null && !e.getMessage().isEmpty()) {
                errorMessage = "Login failed: " + e.getMessage();
            }
            
            return ResponseEntity.status(401).body(errorMessage);
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(
        @CookieValue (
            value = "authToken", 
            //required is false to handle cases when cookie might be cleared by user 
            //then in that case it will be expired after some time and neednt be in the blacklist
            required = false) String CookieToken,
        @RequestHeader(value = "Authorization", required = false) String authHeader) {

        String token = null;
        //Cookie method if cookie is present
        if(CookieToken != null){
            token = CookieToken;
        }
        //Header method if header is present and cookie is not
        else if(authHeader != null && authHeader.startsWith("Bearer ")){
            token = authHeader.substring(7);
        }

        // Blacklist token if available
        if(token != null && !token.trim().isEmpty()) {
            try {
                jwtService.blackListToken(token);
                logger.info("Token successfully blacklisted during logout");
            } catch (Exception e) {
                logger.warn("Failed to blacklist token during logout: {}", e.getMessage());
                // Continue with logout even if blacklisting fails
            }
        } else {
            logger.info("No token found during logout - user may have already been logged out");
        }
        
        // Always clear the JWT cookie regardless of token presence
        ResponseCookie clearCookie = ResponseCookie.from("authToken", "")
                .httpOnly(true)
                .secure(false) // Set to true in production with HTTPS
                .path("/")
                .maxAge(0) // Expire immediately
                .sameSite("Lax")
                .build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, clearCookie.toString())
                .body("Logout successful");
    }

}  
