package com.example.Expense_Tracker.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;




@RestController
@RequestMapping("/api/auth")
public class AuthController {


    @GetMapping("path")
    public String getMethodName(@RequestParam String param) {
        return new String();
    }
    // @PostMapping("/register")
    // public ResponseEntity<?> registerUser(@RequestBody User user){
        
    //     return ResponseEntity.ok();
    // }
    
}
