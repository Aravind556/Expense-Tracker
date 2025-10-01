package com.example.Expense_Tracker.Controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@RestController
public class TestController {


    @GetMapping("/test")
    public String Hello() {
        return "hello";
    }
    

}
