package com.example.Expense_Tracker.Controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.Expense_Tracker.Model.Expense;



@RestController
@RequestMapping("/api/expense")
public class TestController {

    @PostMapping("/add")
    public ResponseEntity<?> AddExpense(@RequestParam Expense expense) {
        //TODO: process POST request

        return ResponseEntity.ok(expense);
    }
    @GetMapping("/get")
    public ResponseEntity<?> getallExpenses(@RequestParam String userId) {
        //TODO: implement logic to retrieve all expenses for the user
        return ResponseEntity.ok("List of expenses for user: " + userId);
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteExpense(@RequestParam String expenseId) {
        //TODO: implement logic to delete the expense
        return ResponseEntity.ok("Expense deleted with ID: " + expenseId);
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable String id, @RequestBody Expense expense) {
        //TODO: process PUT request

        return ResponseEntity.ok(expense);
    }
}
