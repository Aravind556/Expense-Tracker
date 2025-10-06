package com.example.Expense_Tracker.DTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.example.Expense_Tracker.Model.Expense.Category;
import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ExpenseDto {
    private BigDecimal amount;
    private String description;
    private Category category;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdAt;
}
