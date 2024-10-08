from qdrant_client.http import models
from datetime import datetime
from typing import Dict, List, Union, Optional

def create_pinecone_filters(rag_filters: Dict) -> Dict:

	if not rag_filters:
		return None

	def process_condition(condition: Dict, negate=False) -> Dict:
		key = condition.get('key')
		if not key:
			raise ValueError("Condition must have a 'key' field")

		filter_condition = {}

		if 'match' in condition:
			match = condition['match']
			if 'value' in match:
				value = match['value']
				operator = '$ne' if negate else '$eq'
				filter_condition[key] = {operator: value}
			elif 'any' in match:
				any_values = match['any']
				operator = '$nin' if negate else '$in'
				filter_condition[key] = {operator: any_values}
			elif 'except' in match:
				except_values = match['except']
				operator = '$in' if negate else '$nin'
				filter_condition[key] = {operator: except_values}
			else:
				raise ValueError(f"Unsupported match type in condition: {condition}")
		elif 'range' in condition:
			range_ = condition['range']
			if not isinstance(range_, dict):
				raise ValueError(f"'range' must be a dictionary in condition: {condition}")

			range_condition = {}
			for op in ['gt', 'gte', 'lt', 'lte']:
				if op in range_:
					pinecone_op = '$' + op
					if negate:
						# Negate the operator
						op_neg_map = {
							'$gt': '$lte',
							'$gte': '$lt',
							'$lt': '$gte',
							'$lte': '$gt'
						}
						pinecone_op = op_neg_map[pinecone_op]
					range_condition[pinecone_op] = range_[op]
			if range_condition:
				filter_condition[key] = range_condition
			else:
				raise ValueError(f"No valid range operators in condition: {condition}")
		else:
			raise ValueError(f"Unsupported condition type: {condition}")

		return filter_condition

	# Process 'must' and 'must_not' conditions
	must_conditions = rag_filters.get('must', [])
	must_not_conditions = rag_filters.get('must_not', [])
	should_conditions = rag_filters.get('should', [])

	filter_clauses = []

	# Add 'must' conditions
	for cond in must_conditions:
		filter_clauses.append(process_condition(cond))

	# Add 'must_not' conditions
	for cond in must_not_conditions:
		filter_clauses.append(process_condition(cond, negate=True))

	# Combine 'must' and 'must_not' conditions with $and
	combined_filter = {'$and': filter_clauses} if filter_clauses else {}

	# Process 'should' conditions (if any)
	if should_conditions:
		should_clauses = [process_condition(cond) for cond in should_conditions]
		# In Pinecone, $or requires at least one condition to be true
		if combined_filter:
			combined_filter = {
				'$and': [combined_filter, {'$or': should_clauses}]
			}
		else:
			combined_filter = {'$or': should_clauses}

	return combined_filter if combined_filter else None

def create_qdrant_filters(rag_filters: Dict) -> models.Filter:

	if not rag_filters:
		return None

	def construct_field_condition(condition: Dict) -> models.FieldCondition:
		"""Helper function to construct individual FieldCondition based on the condition type."""
		key = condition.get('key')
		match = condition.get('match', {})

		# Check for 'value' (match condition)
		if 'value' in match:
			return models.FieldCondition(
				key=key,
				match=models.MatchValue(value=match['value'])
			)

		# Check for 'any' (match any condition)
		elif 'any' in match:
			return models.FieldCondition(
				key=key,
				match=models.MatchAny(any=match['any'])
			)

		# Check for 'except' (match except condition)
		elif 'except' in match:
			return models.FieldCondition(
				key=key,
				match=models.MatchExcept(**{'except': match['except']})
			)

		# Check for 'range' (range condition)
		if 'range' in condition:
			range_ = condition.get('range')

			# Inline ISO format check
			is_datetime_range = any(
				value is not None and
				(
					(isinstance(value, str) and
					(value.endswith('Z') or 'T' in value))
				)
				for value in [range_.get('gt'), range_.get('gte'), range_.get('lt'), range_.get('lte')]
			)

			range_class = models.DatetimeRange if is_datetime_range else models.Range

			return models.FieldCondition(
				key=key,
				range=range_class(
					gt=range_.get('gt'),
					gte=range_.get('gte'),
					lt=range_.get('lt'),
					lte=range_.get('lte')
				)
			)

		raise ValueError(f"Unsupported match type in condition: {condition}")

	# Helper to process 'must', 'should', and 'must_not'
	def process_conditions(conditions: Optional[List[Dict]]) -> List[models.FieldCondition]:
		if not conditions:
			return []
		return [construct_field_condition(cond) for cond in conditions]

	# Extract and process 'must', 'should', and 'must_not'
	if rag_filters and len(rag_filters) > 0:
		must_conditions = process_conditions(rag_filters.get('must'))
		should_conditions = process_conditions(rag_filters.get('should'))
		must_not_conditions = process_conditions(rag_filters.get('must_not'))

		# Construct and return the filter
		filter_res = models.Filter(
			must=must_conditions or None,
			should=should_conditions or None,
			must_not=must_not_conditions or None
		)
		print(f"filter_res: {filter_res}")
		return filter_res
	return None

