package com.example.Expense_Tracker.Controller;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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

import com.example.Expense_Tracker.DTO.ExpenseDto;
import com.example.Expense_Tracker.Model.Expense;
import com.example.Expense_Tracker.Service.ExpenseService;

import lombok.AllArgsConstructor;



@RestController
@AllArgsConstructor
@RequestMapping("/api/expense")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping("/add")
    public ResponseEntity<Expense> AddExpense(@RequestBody ExpenseDto expense) {
        Expense createdExpense = expenseService.addExpense(expense);
        return ResponseEntity.ok(createdExpense);
    }
    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Long id) {
        Expense expense = expenseService.getExpenseById(id);
        return ResponseEntity.ok(expense);
    }

    @GetMapping("/get")
    public ResponseEntity<List<Expense>> getallExpenses() {
        //TODO: implement logic to retrieve all expenses for the user
        return ResponseEntity.ok(expenseService.getAllExpensesForCurrentUser());
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long expenseId) {
        //TODO: implement logic to delete the expense
        expenseService.deleteExpense(expenseId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/CategoryFilter")
    public ResponseEntity<List<Expense>> getExpensesByCategory(@RequestParam String category) {
        List<Expense> expenses = expenseService.CategoryFilter(category);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/total")
    public ResponseEntity<Double> getTotalExpense() {
        return ResponseEntity.ok(expenseService.getTotalExpenses());
    }

    @GetMapping("/week")
    public ResponseEntity<List<Expense>> getExpensesInWeek() {
        return ResponseEntity.ok(expenseService.getExpensesInWeek());
    }

    @GetMapping("/DateRange")
    public ResponseEntity<List<Expense>> getExpenseByDateEntity(@RequestParam String startDate, @RequestParam String endDate){
        try {
            // Parse date strings and convert to LocalDateTime
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);

            // Convert to LocalDateTime (start of start date, end of end date)
            LocalDateTime startDateTime = start.atStartOfDay();
            LocalDateTime endDateTime = end.atTime(23, 59, 59, 999999999);

            return ResponseEntity.ok(expenseService.getExpensesInDateRange(startDateTime, endDateTime));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/totalByCategory")
    public ResponseEntity<Double> getTotalByCategory(@RequestParam String category){
        return ResponseEntity.ok(expenseService.getTotalExpensesByCategory(category));
    }
    
    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @RequestBody ExpenseDto expenseDto) {
        //TODO: process PUT request
        Expense expense= expenseService.updateExpense(id, expenseDto);
        return ResponseEntity.ok(expense);
    }
}
