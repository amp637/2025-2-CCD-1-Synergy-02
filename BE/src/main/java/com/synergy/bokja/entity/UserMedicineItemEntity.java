package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "user_medicine_item_table")
public class UserMedicineItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long umino;

    @ManyToOne
    @JoinColumn(name = "umno")
    private UserMedicineEntity userMedicine;

    @ManyToOne
    @JoinColumn(name = "mdno")
    private MedicineEntity medicine;

    @Column(columnDefinition = "TEXT")
    private String description;
}
