package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "combination_table")
public class CombinationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cbno;

    @ManyToOne
    @JoinColumn(name = "mtno")
    private MaterialEntity material;

    @Column(length = 20)
    private String name;

    @Column(length = 40)
    private String ingredient;

    @Column(length = 20)
    private String classification;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String information;
}
